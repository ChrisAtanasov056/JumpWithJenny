namespace ServerAPI.Models;

public class EmailText
{
    public string Subject { get; set; }
    public string Body { get; set; }
}

public class EmailTextsByType
{
    public EmailText ResetPassword { get; set; }
    public EmailText ConfirmAccount { get; set; }
}
